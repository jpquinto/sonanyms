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
    }
  ]
}