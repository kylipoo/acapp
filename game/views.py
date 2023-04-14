from django.http import HttpResponse
import openai
import os
os.environ['OPENAI_API_KEY']='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'
openai.api_key=os.getenv('OPENAI_API_KEY')
# response = openai.Completion.create(model='text-davinci-003',prompt='Give me two resons to learn OpenAI API with Python', max_tokens=300)
def index(request):

#    return HttpResponse(response['choices'][0]['text'])
 return HttpResponse('My First Page!')
# Create your views herei
