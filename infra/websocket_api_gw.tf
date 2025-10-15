module "websocket_api" {
  source  = "./modules/websocket_api_gw"
  context = module.null_label.context

  api_name   = "sonanyms-websocket-api"
  stage_name = "prod"

  routes = [
    {
      route_key            = "$connect"
      lambda_invoke_arn    = module.connect_lambda.invoke_arn
      lambda_function_name = module.connect_lambda.name
      authorization_type   = "NONE"
    },
    {
      route_key            = "join_queue"
      lambda_invoke_arn    = module.join_queue_lambda.invoke_arn
      lambda_function_name = module.join_queue_lambda.name
      authorization_type   = "NONE"
    },
    {
      route_key            = "submit_word"
      lambda_invoke_arn    = module.submit_word_lambda.invoke_arn
      lambda_function_name = module.submit_word_lambda.name
      authorization_type   = "NONE"
    },
    {
      route_key            = "finish_round"
      lambda_invoke_arn    = module.finish_round_lambda.invoke_arn
      lambda_function_name = module.finish_round_lambda.name
      authorization_type   = "NONE"
    },
    {
      route_key            = "$disconnect"
      lambda_invoke_arn    = module.disconnect_lambda.invoke_arn
      lambda_function_name = module.disconnect_lambda.name
      authorization_type   = "NONE"
    },
  ]
}