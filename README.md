# Gif Judge

The react front end is hosted on GitHub pages and the API backend is hosted on API gateway.

The following will deploy the backend API, it needs an aws profile to be set in the session.

```bash
export AWS_PROFILE=personal
make terraform_up
```

The following will build and deploy the react front end to GitHub pages.
If the changes arent reflected then the job might need to be manually triggered in the Actions tab.

```bash
make app_deploy
```

## Local

Add these to your .env file:

```bash
export GIPHY_API_KEY=""
export AWS_ACCESS=""
export AWS_SECRET=""
export REACT_APP_REST_API_URL=http://127.0.0.1:8000
export REACT_APP_WS_API_URL=ws://127.0.0.1:8000
export WEBSOCKET_API_ENDPOINT=ws://127.0.0.1:8000
```

```
workon gif_judge
make api_local
# Separate terminal
make app_local
```

## References

https://medium.com/@grahamflas/how-to-create-a-simple-gif-searching-app-with-a-react-frontend-and-rails-backend-and-a-backend-13fd77bf152

https://tighten.co/blog/react-101-building-a-gif-search-engine/

Consider using this package to install terraform on local stack
https://github.com/localstack/terraform-local

## Deployment

Theres a GitHub action that does the following:
- runs Terraform to redeploy the `api` directory code to API gateway and anything else in the `infra` directory (S3 buckets, Dynamo tables, etc.)
- The front end is hosted by Netlify https://gif-judge.netlify.app/
