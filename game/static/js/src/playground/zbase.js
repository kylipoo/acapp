class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground">hello playground</div>`);

        this.hide();
        this.root.$ac_game.append(this.$playground);

        this.start();
    }


    start() {
    }

    show(mode) {  // 打开playground界面
        let outer = this;
        this.$playground.show();

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.mode = mode;
        this.state = "waiting";  // waiting -> fighting -> over

    }

    hide() {  // 关闭playground界面

        this.$playground.empty();

        this.$playground.hide();
    }
}

