module "finish_round_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "finish-round-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/websocket_api_gw/finish_round"
  build_path      = "${path.root}/../lambda_functions/build/websocket_api_gw/finish_round/finish_round.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    GAME_SESSIONS_TABLE_NAME : module.game_sessions_table.name
  }
}


resource "aws_iam_policy" "finish_round_policy" {
  name        = "finish-round-policy"
  description = "Policy for finish round lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
            module.game_sessions_table.arn,
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "execute-api:*"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "finish_round_attach" {
  role       = module.finish_round_lambda.role_name
  policy_arn = aws_iam_policy.finish_round_policy.arn
}
