SHELL := /bin/bash

terraform_init:
	source .env && cd infra && terraform init

terraform_deploy:
	cd api && python3 -m venv venv && source venv/bin/activate && pip install -r api/requirements.txt && cp -r ./venv/lib/python3.9/site-packages/ ../infra/.temp && cp -r api/* ../infra/.temp
	source .env && cd infra && terraform apply -auto-approve

terraform_down:
	cd infra && terraform destroy

api_local:
	source .venv/bin/activate && . env.sh && cd api/ && uvicorn api.main:app --reload

app_local:
	. env.sh && cd gif-judge && npm start
