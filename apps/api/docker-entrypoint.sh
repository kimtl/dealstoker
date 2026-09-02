#!/bin/sh
set -eu

convert_if_needed() {
  var_name="$1"
  eval "val=\${$var_name:-}"
  if [ -z "$val" ]; then
    return 0
  fi
  case "$val" in
    jdbc:*)
      return 0
      ;;
    postgres://*|postgresql://*)
      rest="${val#*://}"
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
      jdbc="jdbc:postgresql://${hostport}/${db}?sslmode=require"
      export "$var_name=$jdbc"
      export DATABASE_USERNAME="${DATABASE_USERNAME:-$user}"
      export DATABASE_PASSWORD="${DATABASE_PASSWORD:-$pass}"
      export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-$user}"
      export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-$pass}"
      echo "Converted $var_name to JDBC form for Spring Boot"
      ;;
  esac
}

convert_if_needed DATABASE_URL
convert_if_needed DATABASE_PRIVATE_URL
convert_if_needed DATABASE_PUBLIC_URL
convert_if_needed SPRING_DATASOURCE_URL
convert_if_needed JDBC_DATABASE_URL

if [ -n "${DATABASE_URL:-}" ]; then
  export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-$DATABASE_URL}"
fi

exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
