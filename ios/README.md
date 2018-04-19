# Tanker ui demo ios

## Getting started

```bash
cd tanker-ui-demos/ios
pod update
pod install
open tanker-ui-demo.xcworkspace/
```

Do not forget to change the server address and the trustchain id in the
`Info.plist` file.

```bash
$(EDITOR) tanker-ui-demo/Info.plist
```
```
<key>ServerAddress</key>
<string>http://yourServerAddress:port/</string>
<key>TrustchainId</key>
<string>yourTrustchainId</string>
```
