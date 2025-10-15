module "connect_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "ws-connect-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/websocket_api_gw/connect"
  build_path      = "${path.root}/../lambda_functions/build/websocket_api_gw/connect/connect.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 10
  deployment_type = "zip"
  zip_project     = true

  layers = []

  environment_variables = {
    REGION = var.aws_region
  }
}