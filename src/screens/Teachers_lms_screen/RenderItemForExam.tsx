import React from "react";
import { Text, TextInput, View } from "react-native";
import { scale } from "react-native-size-matters";

const StudentRow = React.memo(
    ({item, handleMarksChange, styles, temporaryMarks, teacherExam}) => {
      // console.log(`Rendering StudentRow for ID: ${item.id}`);

      const marksValue =
        temporaryMarks[item.id] !== undefined
          ? temporaryMarks[item.id].toString()
          : (parseFloat(item.marks || '0') || '').toString();

      return (
        <View style={styles.tableRow}>
          <Text style={styles.nameCell}>{item.name}</Text>
          <Text style={ styles.rollNoCell}>{item.rollNo}</Text>
          {item.isAbsent ? (
            <Text style={[styles.cell, styles.absentCell]}>Absent</Text>
          ) : (
            <TextInput
              style={[styles.cell, styles.marksInput ,{ fontSize: scale(10), fontFamily: 'Poppins-Regular' }]}
              placeholder={`/${parseFloat(teacherExam?.marks) || '100'}`}
              placeholderTextColor="#666"
            
            
              keyboardType="numeric"
              value={marksValue}
              onChangeText={value => handleMarksChange(item.id, value)}
            />
          )}
        </View>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if the marks for this student have changed
      return (
        prevProps.temporaryMarks[prevProps.item.id] ===
          nextProps.temporaryMarks[nextProps.item.id] &&
        prevProps.item.id === nextProps.item.id
      );
    },
  );

  export default StudentRow;