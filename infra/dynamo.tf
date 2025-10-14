module "word_bank_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-word-bank-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "word_id"

  attributes = [
    {
      name = "word_id"
      type = "N"
    }
  ]
}

module "id_status_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-status-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "metric_name"

  attributes = [
    {
      name = "metric_name"
      type = "S"
    }
  ]
}