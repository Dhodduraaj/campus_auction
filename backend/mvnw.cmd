@REM Maven Wrapper Script with Java 21 LTS
@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "MAVEN_CMD=C:\Users\sivap\.tools\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%MAVEN_CMD%" (
    "%MAVEN_CMD%" %*
) else (
    mvn %*
)
