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

module "chain_word_bank_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "chain-word-bank-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "bank_id"
  range_key = "word_id"

  attributes = [
    {
      name = "bank_id"
      type = "S"
    },
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

module "matchmaking_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-matchmaking-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "game_mode"
  range_key = "time_joined"

  attributes = [
    {
      name = "game_mode"
      type = "S"
    },
    {
      name = "time_joined"
      type = "S"
    },
    {
      name = "connection_id"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name = "connection_id_index"
      hash_key = "connection_id"
      range_key = "time_joined"
      projection_type = "KEYS_ONLY"
    }
  ]

  ttl_enabled = true
  ttl_attribute = "ttl"
}

module "custom_lobby_matchmaking_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-custom-lobby-matchmaking-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "lobby_id"
  range_key = "sort_key"

  attributes = [
    {
      name = "lobby_id"
      type = "S"
    },
    {
      name = "sort_key"
      type = "S"
    },
  ]

  ttl_enabled = true
  ttl_attribute = "ttl"
}

module "users_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-users-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "user_id"
  range_key = "sort_key"

  attributes = [
    {
      name = "user_id"
      type = "S"
    },
    {
      name = "sort_key"
      type = "S"
    },
  ]
}

module "users_game_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-users-game-history-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "user_id"
  range_key = "game_id"

  attributes = [
    {
      name = "user_id"
      type = "S"
    },
    {
      name = "game_id"
      type = "S"
    },
  ]
}

module "game_sessions_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "sonanyms-game-sessions-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "game_id"
  range_key = "sort_key"

  attributes = [
    {
      name = "game_id"
      type = "S"
    },
    {
      name = "sort_key"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name = "sort_key_index"
      hash_key = "sort_key"
      range_key = "game_id"
      projection_type = "ALL"
    }
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