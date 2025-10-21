module "disconnect_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "disconnect-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/websocket_api_gw/disconnect"
  build_path      = "${path.root}/../lambda_functions/build/websocket_api_gw/disconnect/disconnect.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.websocket_lambda_layer.layer_arn
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    MATCHMAKING_TABLE_NAME : module.matchmaking_table.name
    GAME_SESSIONS_TABLE_NAME : module.game_sessions_table.name
  }
}


resource "aws_iam_policy" "disconnect_policy" {
  name        = "disconnect-policy"
  description = "Policy for disconnect lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "execute-api:*"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Query",
          "dynamodb:DeleteItem"
        ],
        Resource = [
          module.matchmaking_table.arn,
          "${module.matchmaking_table.arn}/index/connection_id_index"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Query"
        ],
        Resource = [
          module.game_sessions_table.arn,
          "${module.game_sessions_table.arn}/index/sort_key_index"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "disconnect_attach" {
  role       = module.disconnect_lambda.role_name
  policy_arn = aws_iam_policy.disconnect_policy.arn
}