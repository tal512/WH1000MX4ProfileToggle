#!/bin/bash

ACTIVE_PROFILE=$(pactl list cards | awk -v RS='' '/bluez/' | awk -F': ' '/Active Profile/ { print $2 }')
CARD_NAME=$(pactl list cards | awk -v RS='' '/bluez/' | awk -F': ' '/Name/ { print $2 }')

if [ $ACTIVE_PROFILE == 'a2dp_sink' ]
then
    echo 'profile is a2dp_sink'
    $(pactl set-card-profile $CARD_NAME handsfree_head_unit)
else
    echo 'profile is handsfree_head_unit'
    $(pactl set-card-profile $CARD_NAME a2dp_sink)
fi
