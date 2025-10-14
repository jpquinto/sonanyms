module "user_api_gw" {
  source  = "./modules/api_gw"
  context = module.null_label.context

  api_name   = "sonanyms-base-api-gw"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "GET"
      path                 = "get-words"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_words_lambda.invoke_arn
      lambda_function_name = module.get_words_lambda.name
      enable_cors_all      = true
      use_authorizer       = false
    },
  ]
  authorizer_type = "COGNITO_USER_POOLS"
  api_type        = ["REGIONAL"]
}

