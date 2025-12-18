namespace SpriteKind {
    export const Rock = SpriteKind.create()
    export const Collectable = SpriteKind.create()
    export const Shield = SpriteKind.create()
    export const Player_Proj = SpriteKind.create()
}
function movement () {
    if (controller.up.isPressed()) {
        red.vy += acceleration * -1
    } else if (controller.down.isPressed()) {
        red.vy += acceleration
    }
    if (controller.left.isPressed()) {
        red.vx += acceleration * -1
    } else if (controller.right.isPressed()) {
        red.vx += acceleration
    }
    red.vx = red.vx * deceleration
    red.vy = red.vy * deceleration
}
function on_start () {
    controller.moveSprite(red)
    red.setPosition(20, 20)
    red.setStayInScreen(true)
    animation.runImageAnimation(
    skull,
    assets.animation`flaming`,
    150,
    true
    )
    animation.runMovementAnimation(
    skull,
    animation.animationPresets(animation.bobbing),
    4000,
    true
    )
    boss_healthbar.bottom = 120
    shield_sprite.setFlag(SpriteFlag.Invisible, true)
    shield_sprite.setFlag(SpriteFlag.GhostThroughSprites, true)
    shield_sprite.follow(red, 1000)
    scene.setBackgroundImage(assets.image`background`)
    info.setLife(3)
}
function generate_projectiles (time: number) {
    arc_size = randint(1, 3) * 90
    start = randint(1, 360)
    loops.forFromToBy(0, arc_size, 10, function (i) {
        fire_angle = spriteutils.degreesToRadians(start + i)
        if (randint(0, 2) == 2) {
            proj = sprites.create(assets.image`projectilepoison`, SpriteKind.Projectile)
        } else {
            proj = sprites.create(assets.image`projectile`, SpriteKind.Projectile)
        }
        proj.setPosition(skull.x, skull.y)
        proj.z = -1
        proj.setFlag(SpriteFlag.AutoDestroy, true)
        spriteutils.setVelocityAtAngle(proj, fire_angle, 40)
        pause(time)
    })
}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    timer.throttle("block", 2000, function () {
        block()
    })
})
function spawn_rock () {
    rock_sprite = sprites.create(image.create(16, 16), SpriteKind.Rock)
    spriteutils.placeAngleFrom(
    rock_sprite,
    randint(0, Math.getPi() * 2),
    35,
    spriteutils.pos(skull.x, skull.y)
    )
    anim = assets.animation`entry`
    frame_len = 100
    scene.cameraShake(4, anim.length * frame_len)
    animation.runImageAnimation(
    rock_sprite,
    anim,
    frame_len,
    false
    )
    hide_rock(rock_sprite, anim)
}
sprites.onOverlap(SpriteKind.Rock, SpriteKind.Rock, function (sprite, otherSprite) {
    otherSprite.destroy()
})
function poison () {
    boss_healthbar.value += -5
}
game.onUpdateRandomInterval(3500, 5000, false, function () {
    for (let index = 0; index < randint(1, 3); index++) {
        timer.background(function () {
            spawn_rock()
        })
    }
    music.play(music.melodyPlayable(music.zapped), music.PlaybackMode.UntilDone)
    if (randint(1, 2) == 2) {
        generate_projectiles(50)
    } else {
        generate_projectiles(0)
    }
    if (randint(1, 3) == 1) {
        timer.after(1500, function () {
            enemy_move()
        })
    }
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Rock, function (sprite, otherSprite) {
    sprite.destroy()
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Projectile, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    pause(1000)
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Rock, function (sprite, otherSprite) {
    angle = spriteutils.angleFrom(otherSprite, sprite)
    spriteutils.placeAngleFrom(
    sprite,
    angle,
    16,
    otherSprite
    )
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Shield, function (sprite, otherSprite) {
    sprite.setKind(SpriteKind.Player_Proj)
    angle = spriteutils.angleFrom(otherSprite, skull)
    spriteutils.setVelocityAtAngle(sprite, angle, 40)
})
function block () {
    shield_sprite.setFlag(SpriteFlag.Invisible, false)
    shield_sprite.setFlag(SpriteFlag.GhostThroughSprites, false)
    pause(1000)
    shield_sprite.setFlag(SpriteFlag.Invisible, true)
    shield_sprite.setFlag(SpriteFlag.GhostThroughSprites, true)
}
game.onUpdateRandomInterval(8000, 12000, false, function () {
    star = sprites.create(assets.image`star`, SpriteKind.Collectable)
    star.setPosition(randint(10, 150), randint(10, 110))
    star.lifespan = 4000
})
function enemy_move () {
    animation.stopAnimation(animation.AnimationTypes.MovementAnimation, skull)
    x = randint(40, 120)
    y = randint(30, 90)
    spriteutils.moveTo(skull, spriteutils.pos(x, y), 1500)
    pause(1500)
    animation.runMovementAnimation(
    skull,
    animation.animationPresets(animation.bobbing),
    4000,
    true
    )
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Collectable, function (sprite, otherSprite) {
    info.changeScoreBy(10000)
    music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
    sprites.destroy(otherSprite)
})
function move_check () {
    if (Math.abs(red.vx) > 8 || Math.abs(red.vy) > 8) {
        if (!(is_moving)) {
            animation.runImageAnimation(
            red,
            assets.animation`walking`,
            100,
            true
            )
            is_moving = true
        }
    } else {
        animation.stopAnimation(animation.AnimationTypes.All, red)
        red.setImage(assets.image`red`)
        is_moving = false
    }
}
sprites.onDestroyed(SpriteKind.Projectile, function (sprite) {
    info.changeScoreBy(10)
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Player_Proj, function (sprite, otherSprite) {
    if (otherSprite.image.equals(assets.image`projectilepoison`)) {
        for (let index = 0; index < 3; index++) {
            timer.throttle("take_damage", 1000, function () {
                poison()
            })
        }
    }
    boss_healthbar.value += -5
    sprites.destroy(otherSprite)
    if (boss_healthbar.value < 1) {
        game.gameOver(true)
    }
})
function hide_rock (rock: Sprite, anim: any[]) {
    pause(randint(2500, 8000))
    anim.reverse()
    animation.runImageAnimation(
    rock,
    anim,
    frame_len,
    false
    )
    rock.lifespan = frame_len * anim.length
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    controller.moveSprite(sprite, 0, 0)
    sprite.sayText("ow", 500, false)
    sprite.startEffect(effects.fire, 1000)
    info.changeLifeBy(-1)
    angle = spriteutils.angleFrom(otherSprite, sprite)
    spriteutils.setVelocityAtAngle(sprite, angle, 150)
    timer.after(100, function () {
        controller.moveSprite(sprite)
        sprite.setVelocity(0, 0)
    })
})
let y = 0
let x = 0
let star: Sprite = null
let angle = 0
let frame_len = 0
let anim: Image[] = []
let rock_sprite: Sprite = null
let proj: Sprite = null
let fire_angle = 0
let start = 0
let arc_size = 0
let deceleration = 0
let acceleration = 0
let is_moving = false
let skull: Sprite = null
let red: Sprite = null
let boss_healthbar: StatusBarSprite = null
let shield_sprite: Sprite = null
shield_sprite = sprites.create(assets.image`shield`, SpriteKind.Shield)
boss_healthbar = statusbars.create(160, 4, StatusBarKind.Health)
red = sprites.create(assets.image`red`, SpriteKind.Player)
skull = sprites.create(assets.image`flaming skull`, SpriteKind.Enemy)
is_moving = false
acceleration = 8
deceleration = 0.9
on_start()
game.onUpdate(function () {
    movement()
    move_check()
})
