from django.http import JsonResponse
from game.models.player.player import Player

def getinfo_acapp(request): # 在AcWingOS时的getinfo
    player = Player.objects.all()[0]
    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo,
    })
def getinfo_web(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({
            'result': "未登录"
        })
    else:
        player = Player.objects.get(user=user)
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })


def getinfo(request): # 每个处理请求的函数都要有这个参数'request'
    platform = request.GET.get('platform')
    # 路由
    if platform == "ACAPP": 
        return getinfo_acapp(request)
    elif platform == "WEB": 
        return getinfo_web(request)

