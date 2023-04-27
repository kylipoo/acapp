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

    update()
    {
        this.update_move();
        this.render();
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

