const config = {
    type: Phaser.AUTO,
    width: GARDEN_CONFIG.phaser.width,
    height: GARDEN_CONFIG.phaser.height,
    backgroundColor: GARDEN_CONFIG.phaser.backgroundColor,
    parent: document.body,
    scene: SandScene
};

new Phaser.Game(config);
