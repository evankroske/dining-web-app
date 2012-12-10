# usf schema

# --- !Ups

create table usf_restaurants (
id serial primary key,
name varchar(100),
sunday_hours bigint,
monday_hours bigint,
tuesday_hours bigint,
wednesday_hours bigint,
thursday_hours bigint,
friday_hours bigint,
saturday_hours bigint);

# --- !Downs

drop table usf_restaurants;
