import urllib.request, json
req1 = urllib.request.Request('http://127.0.0.1:8080/api/login/', data=json.dumps({'email': 'testadmin@example.com', 'password': 'password123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
res1 = urllib.request.urlopen(req1)
token = json.loads(res1.read())['access']
req2 = urllib.request.Request('http://127.0.0.1:8080/api/admin/surveys/export/', headers={'Authorization': 'Bearer ' + token})
try:
    urllib.request.urlopen(req2)
except Exception as e:
    html = e.read().decode('utf-8')
    for line in html.split('\n'):
        if 'exception_value' in line:
            print(line)
