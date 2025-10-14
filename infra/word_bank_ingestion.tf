module "word_bank_ingestion_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "word-bank-ingestion-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/word_bank_ingestion"
  build_path      = "${path.root}/../lambda_functions/build/word_bank_ingestion/word_bank_ingestion.zip"
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
    ID_STATUS_TABLE_NAME : module.id_status_table.name
    WORD_BANK_TABLE_NAME : module.word_bank_table.name
  }
}


resource "aws_iam_policy" "word_bank_ingestion_policy" {
  name        = "word-bank-ingestion-policy"
  description = "Policy for word bank ingestor lambda."

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
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:GetObjectAcl",
          "s3:DeleteObject"
        ],
        Resource = ["${module.s3_bucket.bucket_arn}/*"]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:ListBucket",
        ],
        Resource = [module.s3_bucket.bucket_arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "word_bank_ingestion_attach" {
  role       = module.word_bank_ingestion_lambda.role_name
  policy_arn = aws_iam_policy.word_bank_ingestion_policy.arn
}
