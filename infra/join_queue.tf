module "join_queue_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "join-queue-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/websocket_api_gw/join_queue"
  build_path      = "${path.root}/../lambda_functions/build/websocket_api_gw/join_queue/join_queue.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
    module.websocket_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    ID_STATUS_TABLE_NAME : module.id_status_table.name
    WORD_BANK_TABLE_NAME : module.word_bank_table.name
    MATCHMAKING_TABLE_NAME : module.matchmaking_table.name
    GAME_SESSIONS_TABLE_NAME : module.game_sessions_table.name
  }
}


resource "aws_iam_policy" "join_queue_policy" {
  name        = "join-queue-policy"
  description = "Policy for join queue lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
            module.id_status_table.arn,
            module.word_bank_table.arn,
            module.matchmaking_table.arn,
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

resource "aws_iam_role_policy_attachment" "join_queue_attach" {
  role       = module.join_queue_lambda.role_name
  policy_arn = aws_iam_policy.join_queue_policy.arn
}
