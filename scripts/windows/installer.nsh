!macro customInstall
  DetailPrint "Preparing Raseed local database..."
  nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$INSTDIR\resources\support\Bootstrap-Raseed.ps1" -PostgresInstaller "$INSTDIR\resources\prerequisites\postgresql-17.7-1-windows-x64.exe" -PreventSleep'
  Pop $0
  StrCmp $0 "0" database_ready
  MessageBox MB_ICONSTOP|MB_OK "Raseed could not prepare its local database. The application was not started. Installer log: $INSTDIR\resources\support\bootstrap-install.log"
  Abort
database_ready:
!macroend
