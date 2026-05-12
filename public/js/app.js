import { StorageManager } from "./managers/StorageManager.js";
import { AssessmentCatalogManager } from "./managers/AssessmentCatalogManager.js";
import { AssessmentExportManager } from "./managers/AssessmentExportManager.js";
import { AssessmentImportManager } from "./managers/AssessmentImportManager.js";
import { AssessmentClientManager } from "./managers/AssessmentClientManager.js";
import { AssessmentStateManager } from "./managers/AssessmentStateManager.js";
import { AssessmentWorkflowManager } from "./managers/AssessmentWorkflowManager.js";
import { AssessmentCoordinator } from "./coordinators/AssessmentCoordinator.js";
import { AssessmentRenderer } from "./view/AssessmentRenderer.js";

class AssessmentApp {
  static async bootstrap() {
    const rootElement = document.getElementById("app");

    try {
      const catalogManager = await AssessmentCatalogManager.load();
      const dataManager = catalogManager.getDataManager(catalogManager.getDefaultAssessment().id);
      const storageManager = new StorageManager();
      const clientManager = new AssessmentClientManager(storageManager);
      const workflowManager = new AssessmentWorkflowManager(dataManager);
      const stateManager = new AssessmentStateManager(
        catalogManager,
        storageManager,
        workflowManager,
        clientManager
      );
      const renderer = new AssessmentRenderer(rootElement);
      const exportManager = new AssessmentExportManager(
        () => stateManager.getDataManager(),
        () => stateManager.getState()
      );
      const importManager = new AssessmentImportManager(() => stateManager.getDataManager());
      const coordinator = new AssessmentCoordinator(
        renderer,
        stateManager,
        exportManager,
        importManager
      );

      stateManager.initialize();
      coordinator.bindEvents();
      coordinator.render();
    } catch (error) {
      rootElement.innerHTML = `<div class="card"><p class="empty-state">${error.message}</p></div>`;
    }
  }
}

AssessmentApp.bootstrap();
