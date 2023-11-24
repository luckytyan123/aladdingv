import cloudscraper
import re
import json

MAX_RETRIES = 5


class AladdinGlassVape:

  def __init__(self):
    self.session = cloudscraper.create_scraper(browser='chrome')
    self.session.headers.update({
        'User-Agent':
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    })
    self.session.headers.update({
        'origin':
        'https://aladdin-glass-vape-636816.shoplightspeed.com',
        'referer':
        'https://aladdin-glass-vape-636816.shoplightspeed.com/'
    })

  def _get_client_id(self):
    self.session.get('https://api.lightspeed.app/auth/identity')
    response = self.session.get(
        'https://aladdin-glass-vape-636816.shoplightspeed.com/admin/auth/login'
    )
    client_id = re.search(r"clientId: '(.*?)'", response.text).group(1)
    for cookie in response.cookies:
      if str(cookie) != '__cf_bm':
        self.session.cookies.pop(str(cookie), None)
    return client_id

  def authenticate(self, email, password):
    for _ in range(MAX_RETRIES):
      try:
        client_id = self._get_client_id()
        url = 'https://api.lightspeed.app/auth/lightspeed/ecom-na'
        data = {"username": email, "password": password}
        self.session.headers.update({
            'Content-Type': "application/json",
        })
        response = self.session.post(url, json=data)
        self.session.cookies.pop('_ls_oidc_initial_jti__retail', None)
        data = {
            "username": email,
            "password": password,
            "redirect_uri":
            "https://services.shoplightspeed.com/auth/oidc/callback?target_shop_id=636816",
            "client_id": client_id
        }
        self.session.headers.update({
            'Content-Type':
            "application/x-www-form-urlencoded",
        })
        response = self.session.post(url, data=json.dumps(data))
        token = re.search(r'name="csrf-token" content="(.*?)"',
                          response.text).group(1)
        self.session.get(
            f'https://aladdin-glass-vape-636816.shoplightspeed.com/admin/auth/sso?token={token}'
        )
        for cookie in self.session.cookies:
          if cookie.name == 'backend_session_id' and cookie.domain == 'aladdin-glass-vape-636816.shoplightspeed.com':
            backend_cookie = cookie.value
            return {"session_cookie": backend_cookie}

        raise Exception('An error occurred')
      except Exception as e:
        print(f'An error occurred: {str(e)}')
