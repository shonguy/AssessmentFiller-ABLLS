export class AssessmentClientManager {
  static addClientOptionId = "__add_client__";

  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  initialize(defaultAssessmentStates) {
    let clients = this.normalizeClients(
      this.storageManager.loadClients(),
      defaultAssessmentStates
    );

    if (clients.length === 0) {
      clients = [this.createClient(
        "Client 1",
        this.buildMigratedAssessmentStates(defaultAssessmentStates)
      )];
      this.storageManager.saveClients(clients);
    }

    const savedClientId = this.storageManager.loadActiveClientId();
    const activeClient = this.findClient(clients, savedClientId) ?? clients[0];
    this.storageManager.saveActiveClientId(activeClient.id);

    return { clients, activeClient };
  }

  addClient(clients, clientName, defaultAssessmentStates) {
    const normalizedName = this.normalizeClientName(clientName, clients.length + 1);
    const client = this.createClient(normalizedName, defaultAssessmentStates);
    const nextClients = [...clients, client];
    this.storageManager.saveClients(nextClients);
    this.storageManager.saveActiveClientId(client.id);

    return { clients: nextClients, activeClient: client };
  }

  saveClientState(clients, clientId, assessmentId, scores, workflowState) {
    const nextClients = clients.map((client) => {
      if (client.id !== clientId) {
        return client;
      }

      return {
        ...client,
        assessments: {
          ...client.assessments,
          [assessmentId]: {
            scores: { ...scores },
            workflow: { ...workflowState },
          },
        },
      };
    });

    this.storageManager.saveClients(nextClients);
    return nextClients;
  }

  selectClient(clients, clientId) {
    const activeClient = this.findClient(clients, clientId);
    if (!activeClient) {
      return null;
    }

    this.storageManager.saveActiveClientId(activeClient.id);
    return activeClient;
  }

  findClient(clients, clientId) {
    return clients.find((client) => client.id === clientId) ?? null;
  }

  getAssessmentState(client, assessmentId, defaultAssessmentState) {
    const assessmentState = client?.assessments?.[assessmentId];
    return {
      scores: this.normalizeObject(assessmentState?.scores, defaultAssessmentState.scores),
      workflow: this.normalizeObject(assessmentState?.workflow, defaultAssessmentState.workflow),
    };
  }

  createClient(name, assessmentStates) {
    return {
      id: `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      assessments: this.cloneAssessmentStates(assessmentStates),
    };
  }

  normalizeClients(clients, defaultAssessmentStates) {
    if (!Array.isArray(clients)) {
      return [];
    }

    return clients
      .filter((client) => client && typeof client.id === "string")
      .map((client, index) => this.normalizeClient(client, index, defaultAssessmentStates));
  }

  normalizeClient(client, index, defaultAssessmentStates) {
    const assessments = this.cloneAssessmentStates(defaultAssessmentStates);
    const legacyAssessmentId = Object.keys(defaultAssessmentStates)[0];

    Object.entries(client.assessments ?? {}).forEach(([assessmentId, assessmentState]) => {
      const defaults = defaultAssessmentStates[assessmentId];
      if (!defaults) {
        return;
      }

      assessments[assessmentId] = {
        scores: this.normalizeObject(assessmentState?.scores, defaults.scores),
        workflow: this.normalizeObject(assessmentState?.workflow, defaults.workflow),
      };
    });

    if (client.scores || client.workflow) {
      assessments[legacyAssessmentId] = {
        scores: this.normalizeObject(client.scores, defaultAssessmentStates[legacyAssessmentId].scores),
        workflow: this.normalizeObject(client.workflow, defaultAssessmentStates[legacyAssessmentId].workflow),
      };
    }

    return {
      id: client.id,
      name: this.normalizeClientName(client.name, index + 1),
      assessments,
    };
  }

  buildMigratedAssessmentStates(defaultAssessmentStates) {
    const assessmentStates = this.cloneAssessmentStates(defaultAssessmentStates);
    const legacyAssessmentId = Object.keys(defaultAssessmentStates)[0];

    assessmentStates[legacyAssessmentId] = {
      scores: this.storageManager.loadScores(defaultAssessmentStates[legacyAssessmentId].scores),
      workflow: this.storageManager.loadWorkflowState(defaultAssessmentStates[legacyAssessmentId].workflow),
    };

    return assessmentStates;
  }

  cloneAssessmentStates(assessmentStates) {
    return Object.fromEntries(
      Object.entries(assessmentStates).map(([assessmentId, state]) => [
        assessmentId,
        {
          scores: { ...state.scores },
          workflow: { ...state.workflow },
        },
      ])
    );
  }

  normalizeClientName(name, fallbackNumber) {
    const normalizedName = String(name ?? "").trim();
    return normalizedName || `Client ${fallbackNumber}`;
  }

  normalizeObject(value, fallback) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ...fallback };
    }

    return { ...fallback, ...value };
  }
}
