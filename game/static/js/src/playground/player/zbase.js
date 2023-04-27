class Player extends AcGameObject
{
    constructor(playground, x, y, radius, color, is_me, speed)
    {
        super(true);

        this.playground = playground; // 所属playground
        this.ctx = this.playground.game_map.ctx; // 操作的画笔

        this.x = x;  // 坐标
        this.y = y; // 坐标
        this.radius = radius; // 半径
        this.color = color; // 颜色
        this.is_me = is_me; // 玩家类型
        this.move_length = 0;

        this.speed = speed; // 速度i
        this.is_alive = true; // 是否存活

        this.eps = 0.01; // 精度，这里建议定义为全局变量，EPS = 0.1，在这个教程里以后都这么用。
        this.vx = 1;
        this.vy = 1;

    }

    render()
    {
        this.x += this.vx;
        this.y += this.vy;
        // 画圆的方法，请照抄，深入了解同样自行查阅菜鸟教程
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
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
            }
        });
    }


    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty)
    {
        this.move_length = this.get_dist(this.x, this.y, tx, ty); // 跟目的地的距离
        let dx = tx - this.x, dy = ty - this.y;
        let angle = Math.atan2(dy, dx); // 计算角度，这里Math.atan2(y, x)相当于求arctan(y / x);

        this.vx = Math.cos(angle); // vx是这个速度（单位向量）的x上的速度（学过向量的都明白）
        this.vy = Math.sin(angle); // vy是这个速度的y上的速度
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
        this.update_move();
        this.render(); // 同样要一直画一直画（yxc：“人不吃饭会死，物体不一直画会消失。”）
    }

    update_move() // 将移动单独写为一个过程
    {
        if (this.move_length < this.eps) // 移动距离没了（小于精度）
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

