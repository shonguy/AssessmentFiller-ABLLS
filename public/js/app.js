import { StorageManager } from "./managers/StorageManager.js";
import { AssessmentDataManager } from "./managers/AssessmentDataManager.js";
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
      const dataManager = await AssessmentDataManager.load();
      const storageManager = new StorageManager();
      const clientManager = new AssessmentClientManager(storageManager);
      const workflowManager = new AssessmentWorkflowManager(dataManager);
      const stateManager = new AssessmentStateManager(
        dataManager,
        storageManager,
        workflowManager,
        clientManager
      );
      const renderer = new AssessmentRenderer(rootElement);
      const exportManager = new AssessmentExportManager(dataManager, () => stateManager.getState());
      const importManager = new AssessmentImportManager(dataManager);
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
