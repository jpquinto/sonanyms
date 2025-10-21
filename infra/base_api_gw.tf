

module "base_api_gw" {
    source  = "./base_api_gw"
    context = module.null_label.context

    user_game_history_table_name = module.user_game_history_table.name
    user_game_history_table_arn  = module.user_game_history_table.arn

    word_bank_table_name = module.word_bank_table.name
    word_bank_table_arn  = module.word_bank_table.arn

    users_table_name = module.users_table.name
    users_table_arn  = module.users_table.arn

    id_status_table_name = module.id_status_table.name
    id_status_table_arn  = module.id_status_table.arn

    shared_layer_arn = module.shared_lambda_layer.layer_arn
    elo_layer_arn    = module.elo_layer.layer_arn
}