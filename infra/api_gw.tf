
module "sonanyms_api_gw" {
  source = "./modules/api_gw"

  api_name   = "sonanyms-api"
  stage_name = "dev"

  http_routes = [

    {
      http_method          = "GET",
      path                 = "get-round",
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_round_lambda.invoke_arn
      lambda_function_name = module.get_round_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    },
    {
      http_method          = "POST",
      path                 = "round-results",
      integration_type     = "lambda"
      lambda_invoke_arn    = module.round_results_lambda.invoke_arn
      lambda_function_name = module.round_results_lambda.name
      enable_cors_all      = true
      use_authorizer       = false # TODO: Enable when auth is ready
    }
  ]
  api_type        = ["REGIONAL"]
  authorizer_type = "NONE"

  enable_api_key = true

  aws_region    = var.aws_region
  label_context = module.null_label.context
}
