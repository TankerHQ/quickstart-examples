# Notepad Android example application

## Getting started

Do not forget to change the server address and the trustchain id in the following files:

```java
// TheTankerApplication.java
public String getServerAddress() { return "http://10.0.2.2:8080/"; }
```

```java
// LoginActivity.java
options.setTrustchainId("your-truschain-id");
```

You can also find useful information about the [Network address space](https://developer.android.com/studio/run/emulator-networking) in the Android documentation.