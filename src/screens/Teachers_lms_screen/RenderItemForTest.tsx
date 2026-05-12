// RenderItem.js
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {View, Text, TextInput} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// type TestIdProps = NativeStackScreenProps<any, any>;

const RenderItem = React.memo(
  ({handleMarksChange, temporaryMarks, item, currentTest, styles}) => {
    // console.log(
    //   'RenderItem Temporary Marks:',
    //   item.id,
    //   temporaryMarks[item.id],
    // );

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.nameCell]}>{item.name}</Text>
        <Text style={styles.tableCell}>{item.rollNo}</Text>
        {item.marks === 'Absent' ? (
          <Text style={[styles.tableCell, styles.absentText]}>Absent</Text>
        ) : (
          <TextInput
            style={[styles.tableCell, styles.input]}
            value={
              temporaryMarks[item.id] !== undefined
                ? temporaryMarks[item.id].toString()
                : (parseFloat(item.marks || '0') || '').toString()
            }
            onChangeText={value => handleMarksChange(item.id, value)}
            placeholder={`/${parseFloat(currentTest?.no_of_marks) || '50'}`}
            placeholderTextColor="#666"
            keyboardType="numeric"
            returnKeyType="done"
            blurOnSubmit={false}
          />
        )}
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item === nextProps.item &&
    prevProps.temporaryMarks[prevProps.item.id] ===
      nextProps.temporaryMarks[nextProps.item.id],
);

export default RenderItem;
