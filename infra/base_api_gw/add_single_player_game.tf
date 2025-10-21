
module "add_single_player_game_lambda" {
  source  = "../modules/lambda"
  context = var.context

  name            = "add-single-player-game-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/base_api_gw/add_single_player_game"
  build_path      = "${path.root}/../lambda_functions/build/base_api_gw/add_single_player_game/add_single_player_game.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  layers = [
    var.shared_layer_arn,
    var.elo_layer_arn,
  ]

  environment_variables = {
    USER_GAME_HISTORY_TABLE_NAME : var.user_game_history_table_name,
    USERS_TABLE_NAME : var.users_table_name,
  }
}

resource "aws_iam_policy" "add_single_player_game_policy" {
  name        = "add-single-player-game-policy"
  description = "Policy for add single player game lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
            var.user_game_history_table_arn,
            var.users_table_arn
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "add_single_player_game_attach" {
  role       = module.add_single_player_game_lambda.role_name
  policy_arn = aws_iam_policy.add_single_player_game_policy.arn
}


