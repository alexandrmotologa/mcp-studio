; Custom NSIS script for MCP Studio installer

!macro preInit
  ; Ensure no orphaned installer instances are blocking the mutex
  InitPluginsDir
  System::Call 'kernel32::GetCurrentProcessId()i.r0'
  nsExec::Exec `"$SYSDIR\cmd.exe" /c taskkill /F /IM "MCP-Studio-Setup*" /FI "PID ne $0"`
!macroend

!macro customInstallMode
  ; Skip the "Choose Users" dialog and install directly for current user
  StrCpy $isForceCurrentInstall "1"
!macroend
