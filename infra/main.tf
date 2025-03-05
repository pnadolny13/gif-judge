terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.48.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
  }

  backend "s3" {
      bucket  = "gif-terraform-state-backend"
      encrypt = true
      key     = "gif_judge/terraform.tfstate"
      region  = "us-east-1"
      dynamodb_table = "gif-terraform-state-state-lock"
  }

  required_version = "~> 1.0"
}

provider "aws" {
  region = var.aws_region
}

resource "random_pet" "lambda_bucket_name" {
  prefix = "gif"
  length = 4
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = random_pet.lambda_bucket_name.id

  acl           = "private"
  force_destroy = true
}

### REST API Lambda

data "archive_file" "lambda_gif_judge" {
  type = "zip"

  source_dir  = "${path.module}/.temp_rest"
  output_path = "${path.module}/gif-judge.zip"

}

resource "aws_s3_bucket_object" "lambda_gif_judge" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "gif-judge.zip"
  source = data.archive_file.lambda_gif_judge.output_path

  etag = filemd5(data.archive_file.lambda_gif_judge.output_path)

}

resource "aws_lambda_function" "lambda_gif_judge" {
  function_name = "GifJudge"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.lambda_gif_judge.key

  runtime = "python3.8"
  handler = "main.handler"

  source_code_hash = data.archive_file.lambda_gif_judge.output_base64sha256

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      AWS_ACCESS = var.aws_access_key,
      AWS_SECRET = var.aws_secret,
      GIPHY_API_KEY = var.giphy_api_key,
      WEBSOCKET_API_ENDPOINT = "https://${aws_apigatewayv2_api.ws_messenger_api_gateway.id}.execute-api.us-east-1.amazonaws.com/${aws_apigatewayv2_stage.ws_messenger_api_stage.id}"
    }
  }
}

resource "aws_cloudwatch_log_group" "gif_judge" {
  name = "/aws/lambda/${aws_lambda_function.lambda_gif_judge.function_name}"

  retention_in_days = 30
}

### Websocket API Lambda

data "archive_file" "lambda_gif_judge_ws" {
  type = "zip"

  source_dir  = "${path.module}/.temp_ws"
  output_path = "${path.module}/gif-judge-ws.zip"

}

resource "aws_s3_bucket_object" "lambda_gif_judge_ws" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "gif-judge-ws.zip"
  source = data.archive_file.lambda_gif_judge_ws.output_path

  etag = filemd5(data.archive_file.lambda_gif_judge_ws.output_path)

}

resource "aws_lambda_function" "lambda_gif_judge_ws_conn_manager" {
  function_name = "GifJudgeWSConnManager"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.lambda_gif_judge_ws.key

  runtime = "python3.8"
  handler = "main.connection_manager"

  source_code_hash = data.archive_file.lambda_gif_judge_ws.output_base64sha256

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      AWS_ACCESS = var.aws_access_key,
      AWS_SECRET = var.aws_secret,
      GIPHY_API_KEY = var.giphy_api_key
    }
  }
}


resource "aws_lambda_function" "lambda_gif_judge_ws_default" {
  function_name = "GifJudgeWSDefault"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.lambda_gif_judge_ws.key

  runtime = "python3.8"
  handler = "main.default_message"

  source_code_hash = data.archive_file.lambda_gif_judge_ws.output_base64sha256

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      AWS_ACCESS = var.aws_access_key,
      AWS_SECRET = var.aws_secret,
      GIPHY_API_KEY = var.giphy_api_key,
      WEBSOCKET_API_ENDPOINT = "https://${aws_apigatewayv2_api.ws_messenger_api_gateway.id}.execute-api.us-east-1.amazonaws.com/${aws_apigatewayv2_stage.ws_messenger_api_stage.id}"
    }
  }
}

resource "aws_lambda_function" "lambda_gif_judge_ws_incoming" {
  function_name = "GifJudgeWSIncoming"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.lambda_gif_judge_ws.key

  runtime = "python3.8"
  handler = "main.handle_incoming_ws_message"

  source_code_hash = data.archive_file.lambda_gif_judge_ws.output_base64sha256

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      AWS_ACCESS = var.aws_access_key,
      AWS_SECRET = var.aws_secret,
      GIPHY_API_KEY = var.giphy_api_key,
      WEBSOCKET_API_ENDPOINT = "https://${aws_apigatewayv2_api.ws_messenger_api_gateway.id}.execute-api.us-east-1.amazonaws.com/${aws_apigatewayv2_stage.ws_messenger_api_stage.id}"
    }
  }
}

resource "aws_cloudwatch_log_group" "gif_judge_ws_conn_manager" {
  name = "/aws/lambda/${aws_lambda_function.lambda_gif_judge_ws_conn_manager.function_name}"

  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "gif_judge_ws_incoming" {
  name = "/aws/lambda/${aws_lambda_function.lambda_gif_judge_ws_incoming.function_name}"

  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "gif_judge_ws_default" {
  name = "/aws/lambda/${aws_lambda_function.lambda_gif_judge_ws_default.function_name}"

  retention_in_days = 30
}

### IAM Roles

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })

  inline_policy {
    name = "my_inline_policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = "execute-api:*"
          Effect = "Allow"
          Resource = "arn:aws:execute-api:*:*:${aws_apigatewayv2_api.ws_messenger_api_gateway.id}/*/*/*"
        },
        {
          Action = [ "logs:*" ],
          Effect = "Allow",
          Resource = [ "arn:aws:logs:*:*:*" ]
        },
        {
          Action = [ "dynamodb:BatchGetItem",
                      "dynamodb:GetItem",
                      "dynamodb:GetRecords",
                      "dynamodb:Scan",
                      "dynamodb:Query",
                      "dynamodb:GetShardIterator",
                      "dynamodb:DescribeStream",
                      "dynamodb:ListStreams" ],
          Effect = "Allow",
          Resource = [
            "${aws_dynamodb_table.games.arn}",
            "${aws_dynamodb_table.games.arn}/*",
            "${aws_dynamodb_table.players.arn}",
            "${aws_dynamodb_table.players.arn}/*",
            "${aws_dynamodb_table.selections.arn}",
            "${aws_dynamodb_table.selections.arn}/*",
            "${aws_dynamodb_table.rounds.arn}",
            "${aws_dynamodb_table.rounds.arn}/*"
          ]
        }
      ]
    })
  }
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

### API Gateway Cloudwatch

resource "aws_api_gateway_account" "api_gw_acct" {
  cloudwatch_role_arn = aws_iam_role.cloudwatch.arn
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "cloudwatch" {
  name               = "api_gateway_cloudwatch_global"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "cloudwatch" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
    ]

    resources = ["*"]
  }
}
resource "aws_iam_role_policy" "cloudwatch" {
  name   = "default"
  role   = aws_iam_role.cloudwatch.id
  policy = data.aws_iam_policy_document.cloudwatch.json
}

### API Gateway (REST)

resource "aws_api_gateway_rest_api" "api_lambda" {
  name        = "gif_judge_api"
}

resource "aws_api_gateway_resource" "proxy" {
   rest_api_id = aws_api_gateway_rest_api.api_lambda.id
   parent_id   = aws_api_gateway_rest_api.api_lambda.root_resource_id
   path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_method" {
   rest_api_id   = aws_api_gateway_rest_api.api_lambda.id
   resource_id   = aws_api_gateway_resource.proxy.id
   http_method   = "ANY"
   authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
   rest_api_id = aws_api_gateway_rest_api.api_lambda.id
   resource_id = aws_api_gateway_method.proxy_method.resource_id
   http_method = aws_api_gateway_method.proxy_method.http_method

   integration_http_method = "POST"
   type                    = "AWS_PROXY"
   uri                     = aws_lambda_function.lambda_gif_judge.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
   rest_api_id   = aws_api_gateway_rest_api.api_lambda.id
   resource_id   = aws_api_gateway_rest_api.api_lambda.root_resource_id
   http_method   = "ANY"
   authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
   rest_api_id = aws_api_gateway_rest_api.api_lambda.id
   resource_id = aws_api_gateway_method.proxy_root.resource_id
   http_method = aws_api_gateway_method.proxy_root.http_method

   integration_http_method = "POST"
   type                    = "AWS_PROXY"
   uri                     = aws_lambda_function.lambda_gif_judge.invoke_arn
}


resource "aws_api_gateway_deployment" "apideploy" {
   depends_on = [
     aws_api_gateway_integration.lambda,
     aws_api_gateway_integration.lambda_root,
   ]

   rest_api_id = aws_api_gateway_rest_api.api_lambda.id
   stage_name  = "test"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_api_gateway_rest_api.api_lambda.name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_gif_judge.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api_lambda.execution_arn}/*/*"
}

### API Gateway (Websocket)

resource "aws_apigatewayv2_api" "ws_messenger_api_gateway" {
  name                       = "gif-judge-ws-api-gateway"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

## Default
resource "aws_apigatewayv2_integration" "ws_messenger_api_integration_default" {
  api_id                    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.lambda_gif_judge_ws_default.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration_response" "ws_messenger_api_integration_default_response" {
  api_id                   = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_id           = aws_apigatewayv2_integration.ws_messenger_api_integration_default.id
  integration_response_key = "/200/"
}

resource "aws_apigatewayv2_route" "ws_messenger_api_default_route" {
  api_id    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.ws_messenger_api_integration_default.id}"
}

resource "aws_apigatewayv2_route_response" "ws_messenger_api_default_route_response" {
  api_id             = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_id           = aws_apigatewayv2_route.ws_messenger_api_default_route.id
  route_response_key = "$default"
}

## Conn Manager
resource "aws_apigatewayv2_integration" "ws_messenger_api_integration_conn_manager" {
  api_id                    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.lambda_gif_judge_ws_conn_manager.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration_response" "ws_messenger_api_integration_conn_response" {
  api_id                   = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_id           = aws_apigatewayv2_integration.ws_messenger_api_integration_conn_manager.id
  integration_response_key = "/200/"
}

resource "aws_apigatewayv2_route" "ws_messenger_api_connect_route" {
  api_id    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_messenger_api_integration_conn_manager.id}"
}

resource "aws_apigatewayv2_route_response" "ws_messenger_api_connect_route_response" {
  api_id             = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_id           = aws_apigatewayv2_route.ws_messenger_api_connect_route.id
  route_response_key = "$default"
}

## Disconnect

resource "aws_apigatewayv2_route" "ws_messenger_api_disconnect_route" {
  api_id    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_messenger_api_integration_conn_manager.id}"
}

resource "aws_apigatewayv2_route_response" "ws_messenger_api_disconnect_route_response" {
  api_id             = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_id           = aws_apigatewayv2_route.ws_messenger_api_disconnect_route.id
  route_response_key = "$default"
}

## Message

resource "aws_apigatewayv2_integration" "ws_messenger_api_integration_incoming" {
  api_id                    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.lambda_gif_judge_ws_incoming.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration_response" "ws_messenger_api_integration_incoming_response" {
  api_id                   = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  integration_id           = aws_apigatewayv2_integration.ws_messenger_api_integration_incoming.id
  integration_response_key = "/200/"
}

resource "aws_apigatewayv2_route" "ws_messenger_api_message_route" {
  api_id    = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_key = "MESSAGE"
  target    = "integrations/${aws_apigatewayv2_integration.ws_messenger_api_integration_incoming.id}"
}

resource "aws_apigatewayv2_route_response" "ws_messenger_api_message_route_response" {
  api_id             = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  route_id           = aws_apigatewayv2_route.ws_messenger_api_message_route.id
  route_response_key = "$default"
}

resource "aws_apigatewayv2_stage" "ws_messenger_api_stage" {
  api_id      = aws_apigatewayv2_api.ws_messenger_api_gateway.id
  name        = "develop"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit = 100
  }
}

resource "aws_lambda_permission" "api_gw_ws_conn" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_gif_judge_ws_conn_manager.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.ws_messenger_api_gateway.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_ws_default" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_gif_judge_ws_default.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.ws_messenger_api_gateway.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_ws_incoming" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_gif_judge_ws_incoming.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.ws_messenger_api_gateway.execution_arn}/*/*"
}
### DynamoDB

resource "aws_dynamodb_table" "games" {
  name           = "games"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

}

resource "aws_dynamodb_table" "players" {
  name           = "players"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

}

resource "aws_dynamodb_table" "selections" {
  name           = "selections"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

}

resource "aws_dynamodb_table" "connections" {
  name           = "connections"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

}

resource "aws_dynamodb_table" "rounds" {
  name           = "rounds"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"
  range_key      = "game_id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "game_id"
    type = "S"
  }

  global_secondary_index {
    name               = "GameIdIndex"
    hash_key          = "game_id"
    projection_type    = "ALL"
    read_capacity     = 1
    write_capacity    = 1
  }
}

resource "aws_lambda_event_source_mapping" "game_trigger" {
  event_source_arn  = aws_dynamodb_table.games.stream_arn
  function_name     = aws_lambda_function.lambda_gif_judge_ws_incoming.arn
  starting_position = "LATEST"
}
