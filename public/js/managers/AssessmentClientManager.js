export class AssessmentClientManager {
  static addClientOptionId = "__add_client__";

  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  initialize(defaultScores, defaultWorkflowState) {
    let clients = this.normalizeClients(
      this.storageManager.loadClients(),
      defaultScores,
      defaultWorkflowState
    );

    if (clients.length === 0) {
      clients = [this.createClient(
        "Client 1",
        this.storageManager.loadScores(defaultScores),
        this.storageManager.loadWorkflowState(defaultWorkflowState)
      )];
      this.storageManager.saveClients(clients);
    }

    const savedClientId = this.storageManager.loadActiveClientId();
    const activeClient = this.findClient(clients, savedClientId) ?? clients[0];
    this.storageManager.saveActiveClientId(activeClient.id);

    return { clients, activeClient };
  }

  addClient(clients, clientName, defaultScores, defaultWorkflowState) {
    const normalizedName = this.normalizeClientName(clientName, clients.length + 1);
    const client = this.createClient(normalizedName, defaultScores, defaultWorkflowState);
    const nextClients = [...clients, client];
    this.storageManager.saveClients(nextClients);
    this.storageManager.saveActiveClientId(client.id);

    return { clients: nextClients, activeClient: client };
  }

  saveClientState(clients, clientId, scores, workflowState) {
    const nextClients = clients.map((client) => {
      if (client.id !== clientId) {
        return client;
      }

      return {
        ...client,
        scores: { ...scores },
        workflow: { ...workflowState },
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

  createClient(name, scores, workflowState) {
    return {
      id: `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      scores: { ...scores },
      workflow: { ...workflowState },
    };
  }

  normalizeClients(clients, defaultScores, defaultWorkflowState) {
    if (!Array.isArray(clients)) {
      return [];
    }

    return clients
      .filter((client) => client && typeof client.id === "string")
      .map((client, index) => ({
        id: client.id,
        name: this.normalizeClientName(client.name, index + 1),
        scores: this.normalizeObject(client.scores, defaultScores),
        workflow: this.normalizeObject(client.workflow, defaultWorkflowState),
      }));
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
