module "webhook_api_gw" {
    source  = "./webhook_api_gw"
    context = module.null_label.context
    
    users_table_arn = module.users_table.arn
    users_table_name = module.users_table.name

    clerk_add_user_webhook_secret    = local.clerk_secrets.CLERK_ADD_USER_WEBHOOK_SECRET
    clerk_delete_user_webhook_secret = local.clerk_secrets.CLERK_DELETE_USER_WEBHOOK_SECRET

    user_game_history_table_arn = module.users_game_history_table.arn
    user_game_history_table_name = module.users_game_history_table.name

    shared_layer_arn = module.shared_lambda_layer.layer_arn
}