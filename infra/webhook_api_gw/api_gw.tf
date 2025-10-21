module "webhook_api_gw" {
  source  = "../modules/api_gw"
  context = var.context

  api_name   = "sonanyms-webook-api-gw"
  stage_name = "prod"

  http_routes = [
    {
      http_method          = "POST"
      path                 = "add-user"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.clerk_add_user_lambda.invoke_arn
      lambda_function_name = module.clerk_add_user_lambda.name
      enable_cors_all      = true
      use_authorizer       = false
      authorizer_id        = module.clerk_add_user_lambda_authorizer.authorizer_id
    },
    {
      http_method          = "POST"
      path                 = "delete-user"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.clerk_delete_user_lambda.invoke_arn
      lambda_function_name = module.clerk_delete_user_lambda.name
      enable_cors_all      = true
      use_authorizer       = false
      authorizer_id        = module.clerk_delete_user_lambda_authorizer.authorizer_id
    },
  ]
  authorizer_type = "NONE"
  api_type        = ["REGIONAL"]
}