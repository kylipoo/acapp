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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
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

