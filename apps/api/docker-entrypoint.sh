#!/bin/sh
set -eu

# Railway injects postgres(ql):// URLs. Convert to JDBC before Spring starts.
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:*)
      ;;
    postgres://*|postgresql://*)
      rest="${DATABASE_URL#*://}"
      userinfo="${rest%%@*}"
      hostportdb="${rest#*@}"
      user="${userinfo%%:*}"
      pass="${userinfo#*:}"
      hostport="${hostportdb%%/*}"
      dbq="${hostportdb#*/}"
      db="${dbq%%\?*}"
      if [ -z "$db" ]; then
        db="railway"
      fi
      export DATABASE_USERNAME="${DATABASE_USERNAME:-$user}"
      export DATABASE_PASSWORD="${DATABASE_PASSWORD:-$pass}"
      export DATABASE_URL="jdbc:postgresql://${hostport}/${db}?sslmode=require"
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      export SPRING_DATASOURCE_USERNAME="$DATABASE_USERNAME"
      export SPRING_DATASOURCE_PASSWORD="$DATABASE_PASSWORD"
      echo "Converted DATABASE_URL to JDBC form for Spring Boot"
      ;;
  esac
fi

exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
