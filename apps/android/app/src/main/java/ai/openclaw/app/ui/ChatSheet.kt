package ai.opencraft.app.ui

import androidx.compose.runtime.Composable
import ai.opencraft.app.MainViewModel
import ai.opencraft.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
