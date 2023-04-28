class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
           Single mode
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
           Multi mode
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
           Exit
        </div>
    </div>
</div>
`);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function(){
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function(){
            outer.root.settings.logout_on_remote();
        });
    }

    show() {  // 显示menu界面
        this.$menu.show();
    }

    hide() {  // 关闭menu界面
        this.$menu.hide();
    }
}

let AC_GAME_OBJECTS = [];
let EPS = 0.1;
let GET_DIST = function(x1, y1, x2, y2)
{
    let dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}
class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;  // 是否执行过start函数
        this.timedelta = 0;  // 当前帧距离上一帧的时间间隔
        this.uuid = this.create_uuid();
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i ++ ) {
            let x = parseInt(Math.floor(Math.random() * 10));  // 返回[0, 1)之间的数
            res += x;
        }
        return res;
    }

    start() {  // 只会在第一帧执行一次
    }

    update() {  // 每一帧均会执行一次
    }

    late_update() {  // 在每一帧的最后执行一次
    }

    on_destroy() {  // 在被销毁前执行一次
    }

    destroy() {  // 删掉该物体
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i ++ ) {
            if (AC_GAME_OBJECTS[i] === this) {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp) {
    for (let i = 0; i < AC_GAME_OBJECTS.length; i ++ ) {
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }

    for (let i = 0; i < AC_GAME_OBJECTS.length; i ++ ) {
        let obj = AC_GAME_OBJECTS[i];
        obj.late_update();
    }

    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);
}


requestAnimationFrame(AC_GAME_ANIMATION);

class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas tabindex=0></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {
        this.$canvas.focus();
    }

    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

class Particle extends AcGameObject
{
    constructor(playground, x, y, radius, color, vx, vy, speed)
    {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;

        this.vx = vx;
        this.vy = vy;
        this.speed = speed;
    }

    render()
    {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    start()
    {
        this.friction_speed = 0.8;
        this.friction_radius = 0.8;
    }

    update()
    {
        this.update_move();
        this.render();
    }

    update_move()
    {
        if (this.speed < EPS * 10 || this.radius < EPS * 10)
        {
            this.destroy();
            return false;
        }

        this.x += this.vx * this.speed * this.timedelta / 1000;
        this.y += this.vy * this.speed * this.timedelta / 1000;

        this.speed *= this.friction_speed;
        this.radius *= this.friction_radius;
    }

}
class Player extends AcGameObject
{
    constructor(playground, x, y, radius, color, is_me, speed)
    {
        super(true);

        this.playground = playground; // 所属playground
        this.ctx = this.playground.game_map.ctx; // 操作的画笔
        this.is_me = is_me;
        this.is_alive = true; // 是否存活
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.spent_time = 0;
        this.fireballs = [];

        this.cur_skill = null;
        if (this.is_me) // 如果这是自己
        {
            this.img = new Image(); // 头像的图片
            this.img.src = this.playground.root.settings.photo; // 头像的图片的URL
        }

    }

    render()
    {
        if (this.is_me)
        {
            // 如果是自己，就画上头像
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.lineWidth = EPS * 10;
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            this.ctx.restore();
        } else {

            this.x += this.vx;
            this.y += this.vy;
            // 画圆的方法，请照抄，深入了解同样自行查阅菜鸟教程
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    add_listening_events()
    {
        let outer = this; // 设置正确的this指针，因为接下来的后面的function内的this不是对象本身的this
        this.playground.game_map.$canvas.on("contextmenu", function(){ // 关闭画布上的鼠标监听右键
            return false;
        });

        this.playground.game_map.$canvas.mousedown(function(e){ // 鼠标监听
            if (!outer.is_alive) return false; // 去世之后就不能动了
            let ee = e.which; // e.which就是点击的键对应的值
            if (ee === 3) // 右键
            {
                outer.move_to(e.clientX, e.clientY); // e.clientX是鼠标的x坐标，e.clientY同理
            }else if (ee === 1) {
                if (outer.cur_skill === "fireball") // 当前技能是火球就发射
                {
                    outer.shoot_fireball(e.clientX, e.clientY);
                    return false;
                }
                outer.cur_skill = null; // 点击之后就得清空
            }
        });
        $(window).keydown(function(e){
            if (!outer.is_alive) return false;
            let ee = e.which;
            if (ee === 81) // Q的keycode是81，其他keycode可以自行查阅
            {
                outer.cur_skill = "fireball"; // 技能选为fireball
                return false;
            }
        });
    }

    move_to(tx, ty)
    {
        this.move_length = GET_DIST(this.x, this.y, tx, ty); // 跟目的地的距离
        let dx = tx - this.x, dy = ty - this.y;
        let angle = Math.atan2(dy, dx); // 计算角度，这里Math.atan2(y, x)相当于求arctan(y / x);

        this.vx = Math.cos(angle); // vx是这个速度（单位向量）的x上的速度（学过向量的都明白）
        this.vy = Math.sin(angle); // vy是这个速度的y上的速度
    }
    shoot_fireball(tx, ty)
    {
        console.log(tx, ty); // 测试用
        // 以下部分在测试成功之后再写入
        let x = this.x, y = this.y;
        let radius = this.playground.height * 0.01; // 半径
        let color = "orange"; // 颜色
        let damage = this.playground.height * 0.01; // 伤害值

        let angle = Math.atan2(ty - this.y, tx - this.x); // 角度
        let vx = Math.cos(angle), vy = Math.sin(angle); // 方向
        let speed = this.playground.height * 0.5; // 速度
        let move_dist = this.playground.height * 1; // 射程

        new Fireball(this.playground, this, x, y, radius, color, damage, vx, vy, speed, move_dist);
    }


    start()
    {
        if (this.is_me) // 只有这个玩家是自己的时候才能加入监听
        {
            this.add_listening_events();
        }
    }


    update()
    {
        this.update_AI();
        this.update_move();
        this.render(); // 同样要一直画一直画（yxc：“人不吃饭会死，物体不一直画会消失。”）
    }

    update_AI()
    {
        if (this.is_me) return false; // 如果这不是一个机器人就直接退出

        this.update_AI_move();
    }

    update_AI_move()
    {
        if (this.move_length < EPS) // 如果停下来就随机选个地方走向那边
        {
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;

            this.move_to(tx, ty);
        }
    }
    is_attacked(obj)
    {
        let angle = Math.atan2(this.y - obj.y, this.x - obj.x); // 角度
        let damage = obj.damage; // 伤害
        // 注意，这里被伤害之后的表现，就是什么方向碰撞就是什么伤害，简单的向量方向计算
        this.is_attacked_concrete(angle, damage);
    }

    is_attacked_concrete(angle, damage) // 被具体伤害
    {
        this.explode_particle(); // 爆发粒子
        this.radius -= damage; // 这里半径就是血量
        this.friction_damage = 0.8; // 击退移动摩擦力

        if (this.is_died()) return false; // 已经去世了吗

        this.x_damage = Math.cos(angle);
        this.y_damage = Math.sin(angle); // (x_damage, y_damage)是伤害向量的方向向量
        this.speed_damage = damage * 100; // 击退速度
    }
    explode_particle()
    {
        for (let i = 0; i < 10 + Math.random() * 5; ++ i) // 粒子数
        {
            let x = this.x, y = this.y;
            let radius = this.radius / 3;
            let angle = Math.PI * 2 * Math.random(); // 随机方向
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;

            new Particle(this.playground, x, y, radius, color, vx, vy, speed); // 创建粒子对象
        }
    }

    is_died()
    {
        if (this.radius < EPS * 10) // 少于这个数表示已经去世
        {
            this.destroy(); // 去世
            return true;
        }
        return false;
    }


    update_move() // 将移动单独写为一个过程
    {

        if (this.speed_damage && this.speed_damage > EPS) // 如果此时在被击退的状态，就不能自己动
        {
            this.vx = this.vy = 0; // 不能自己动
            this.move_length = 0; // 不能自己动
            this.x += this.x_damage * this.speed_damage * this.timedelta / 1000; // 被击退的移动
            this.y += this.y_damage * this.speed_damage * this.timedelta / 1000; // 被击退的移动
            this.speed_damage *= this.friction_damage; // 摩擦力，表现出一个被击退越来越慢的效果
        }


        if (this.move_length < EPS) // 移动距离没了（小于精度）
        {
            this.move_length = 0; // 全都停下了
            this.vx = this.vy = 0;
        }
        else // 否则继续移动
        {
            let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000); // 每个时间微分里该走的距离
            // 注意：this.timedelta 的单位是毫秒，所以要 / 1000 转换单位为秒
            this.x += this.vx * moved; // 移动
            this.y += this.vy * moved; // 移动
            this.move_length -= moved;
        }
    }

    on_destroy() // 死之前在this.playground.players数组里面删掉这个player
    {
        this.is_alive = false; // 已经去世了
        for (let i = 0; i < this.playground.players.length; ++ i)
        {
            let player = this.playground.players[i];
            if (this === player)
            {
                this.playground.players.splice(i, 1);
            }
        }
    }
}

let IS_COLLISION = function(obj1, obj2) // 这是一个全局函数，代表两个物体之间是否碰撞
{
    return GET_DIST(obj1.x, obj1.y, obj2.x, obj2.y) < obj1.radius + obj2.radius; // 很简单的两圆相交条件
}
class Fireball extends AcGameObject
{
    constructor(playground, player, x, y, radius, color, damage, vx, vy, speed, move_dist)
    {
        // 有些步骤前面重复过，这里不再赘述
        super(true);
        this.playground = playground;
        this.player = player;
        this.ctx = this.playground.game_map.ctx;

        this.x = x;
        this.y = y;
        this.radius = radius; // 半径
        this.color = color;
        this.damage = damage; // 伤害值

        this.vx = vx; // 移动方向
        this.vy = vy; // 移动方向
        this.speed = speed; // 速度
        this.move_dist = move_dist; // 射程

    }

    render()
    {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    start()
    {

    }

    is_satisfy_collision(obj) // 真的碰撞的条件
    {
        if (this === obj) return false; // 自身不会被攻击
        if (this.player === obj) return false; // 发射源不会被攻击
        return IS_COLLISION(this, obj); // 距离是否满足
    }

    hit(obj) // 碰撞
    {
        obj.is_attacked && obj.is_attacked(this); // obj被this攻击了
        this.is_attacked(obj); // this被obj攻击了
    }

    is_attacked(obj) // 被伤害
    {
        this.is_attacked_concrete(0, 0); // 具体被伤害多少，火球不需要关注伤害值和血量，因为碰到后就直接消失
    }

    is_attacked_concrete(angle, damage) // 具体被伤害
    {
        this.destroy(); // 直接消失
    }

    update()
    {
        this.update_attack();
        this.update_move();
        this.render();
    }

    update_attack()
    {
        for (let i = 0; i < AC_GAME_OBJECTS.length; ++ i)
        {
            let obj = AC_GAME_OBJECTS[i];
            if (this.is_satisfy_collision(obj)) // 如果真的碰撞了（这样可以保证碰撞条件可以自行定义，以后会很好维护）
            {
                this.hit(obj); // 两个物体碰撞了
                break; // 火球，只能碰到一个物体
            }
        }
    }


    update_move()
    {
        if (this.move_dist < EPS) // 如果走完射程了就消失
        {
            this.destroy();
            return false;
        }

        let moved = Math.min(this.move_dist, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_dist -= moved;
    }
}

let HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

let GET_RANDOM_COLOR = function(){
    let color = "#";
    for (let i = 0; i < 6; ++ i)
    {
        color += HEX[Math.floor(Math.random() * 16)];
    }
    return color;
}
class AcGamePlayground
{
    constructor(root)
    {
        this.root = root;
        this.$playground = $(`
<div class="ac-game-playground"></div>`);

        this.root.$ac_game.append(this.$playground);

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this); // 创建一个地图
        this.players = []; // 创建一个用于储存玩家的数组

        this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, "white", true, this.height * 0.15)); // 创建一个是自己的玩家
        for (let i = 0; i < 5; ++ i)
        {
            this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, GET_RANDOM_COLOR(), false, this.height * 0.15));    
        }

        this.$back = this.$playground.find('.ac-game-playground-item-back')
        this.start();
    }

    add_listening_events()
    {
        let outer = this;
        this.$back.click(function(){
            outer.hide();
            outer.root.$menu.show();
        });
    }

    show()
    {
        this.$playground.show();
    }

    hide()
    {
        this.$playground.hide();
    }

    start()
    {
        this.hide();
        this.add_listening_events();
    }

    update()
    {

    }
}

class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$register.hide();

        this.$acwing_login = this.$settings.find('.ac-game-settings-acwing img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start() {
        if (this.platform === "ACAPP") {
            this.getinfo_acapp();
        } else {
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    add_listening_events() {
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();

        this.$acwing_login.click(function() {
            outer.acwing_login();
        });
    }

    add_listening_events_login() {
        let outer = this;

        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        });
    }

    add_listening_events_register() {
        let outer = this;
        this.$register_login.click(function() {
            outer.login();
        });
        this.$register_submit.click(function() {
            outer.register_on_remote();
        });
    }

    acwing_login() {
        $.ajax({
            url: "https://app5257.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: "GET",
            success: function(resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            }
        });
    }

    login_on_remote() {  // 在远程服务器上登录
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url: "https://app5257.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }
        });
    }

    register_on_remote() {  // 在远程服务器上注册
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app5257.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();  // 刷新页面
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    logout_on_remote() {  // 在远程服务器上登出
        if (this.platform === "ACAPP") {
            this.root.AcWingOS.api.window.close();
        } else {
            $.ajax({
                url: "https://app5257.acapp.acwing.com.cn/settings/logout/",
                type: "GET",
                success: function(resp) {
                    if (resp.result === "success") {
                        location.reload();
                    }
                }
            });
        }
    }

    register() {  // 打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login() {  // 打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    acapp_login(appid, redirect_uri, scope, state) {
        let outer = this;

        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp) {
            if (resp.result === "success") {
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    getinfo_acapp() {
        let outer = this;

        $.ajax({
            url: "https://app5257.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp) {
                if (resp.result === "success") {
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    getinfo_web() {
        let outer = this;

        $.ajax({
            url: "https://app5257.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }
}

export class AcGame {
    constructor(id, AcWingOS) {
        this.id = id;
        this.$ac_game = $('#' + id);
        this.AcWingOS = AcWingOS;

        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}

