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
    },
    {
      name = "word"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name = "word_index"
      hash_key = "word"
      range_key = "word_id"
      projection_type = "ALL"
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

module "matchmaking_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-matchmaking-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "queue_id"
  range_key = "time_joined"

  attributes = [
    {
      name = "queue_id"
      type = "S"
    },
    {
      name = "time_joined"
      type = "S"
    }
  ]

  ttl_enabled = true
  ttl_attribute = "ttl"
}

module "game_sessions_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-game-sessions-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "game_id"

  attributes = [
    {
      name = "game_id"
      type = "S"
    },
    # {
    #   name = "game_status"
    #   type = "S"
    # },
    # {
    #   name = "player_a_username"
    #   type = "S"
    # },
    # {
    #   name = "player_b_username"
    #   type = "S"
    # },
  ]

  ttl_enabled = true
  ttl_attribute = "ttl"
}

module "player_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-player-history-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "username"

  attributes = [
    {
      name = "username"
      type = "S"
    }
  ]
}