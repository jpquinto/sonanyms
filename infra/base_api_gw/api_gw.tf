module "user_api_gw" {
  source  = "../modules/api_gw"
  context = var.context

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
      # authorizer_id        = module.user_lambda_authorizer.authorizer_id
    },
    {
      http_method          = "POST"
      path                 = "add-single-player-game"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.add_single_player_game_lambda.invoke_arn
      lambda_function_name = module.add_single_player_game_lambda.name
      enable_cors_all      = true
      use_authorizer       = false
      # authorizer_id        = module.user_lambda_authorizer.authorizer_id
    },
    {
      http_method          = "GET"
      path                 = "get-me"
      integration_type     = "lambda"
      lambda_invoke_arn    = module.get_me_lambda.invoke_arn
      lambda_function_name = module.get_me_lambda.name
      enable_cors_all      = true
      use_authorizer       = false
      # authorizer_id        = module.user_lambda_authorizer.authorizer_id
    },
    # {
    #   http_method          = "GET"
    #   path                 = "get-first-chains"
    #   integration_type     = "lambda"
    #   lambda_invoke_arn    = module.get_first_chains_lambda.invoke_arn
    #   lambda_function_name = module.get_first_chains_lambda.name
    #   enable_cors_all      = true
    #   use_authorizer       = false
    #   # authorizer_id        = module.user_lambda_authorizer.authorizer_id
    # },
  ]
  authorizer_type = "CUSTOM"
  api_type        = ["REGIONAL"]
}

