class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            Single
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            Multiple
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings-mode">
            Exit
        </div>
    </div>
</div>
            `);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode=this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode=this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings_mode=this.$menu.find('.ac-game-menu-field-item-settings-mode');
        this.start();
    }
    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(() => {
           outer.hide();
            outer.root.playground.show();
        });
        this.$multi_mode.click(()=> {
           console.log("click multi mode");
        });
        this.$settings_mode.click(()=> {
            outer.root.settings.logout_on_remote();
        });
     }
    show() {
        this.$menu.show();
    }
    hide() {
        this.$menu.hide();
    }
}
