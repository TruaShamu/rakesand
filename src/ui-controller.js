class UIController {
    constructor(scene) {
        this.scene = scene;
        this.generateBtn = document.getElementById('generate-btn');
        this.rakeBtn = document.getElementById('rake-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.clearWaypointsBtn = document.getElementById('clear-waypoints-btn');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.generateBtn.addEventListener('click', () => {
            this.scene.generatePath();
            this.updateButtonStates({ pathGenerated: true });
        });

        this.rakeBtn.addEventListener('click', () => {
            this.scene.applyRake();
            this.updateButtonStates({ reset: true });
        });

        this.clearBtn.addEventListener('click', () => {
            this.scene.initGrid();
            this.scene.clearState();
            this.updateButtonStates({ reset: true });
        });

        this.clearWaypointsBtn.addEventListener('click', () => {
            this.scene.clearState();
            this.updateButtonStates({ reset: true });
        });
    }

    updateButtonStates(state) {
        if (state.reset) {
            this.generateBtn.disabled = true;
            this.rakeBtn.disabled = true;
        } else if (state.pathGenerated) {
            this.generateBtn.disabled = true;
            this.rakeBtn.disabled = false;
        } else if (state.waypointAdded) {
            this.generateBtn.disabled = false;
        }
    }

    enableGenerateButton() {
        this.generateBtn.disabled = false;
    }
}
