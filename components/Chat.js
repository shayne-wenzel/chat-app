import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform  } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Configuration for auth process
const firebaseConfig = {
  apiKey: "AIzaSyARB-F1aDTxZsNJyvs3XVS2dC08tEH9qHo",
  authDomain: "chat-tapp.firebaseapp.com",
  projectId: "chat-tapp",
  storageBucket: "chat-tapp.appspot.com",
  messagingSenderId: "379383711514",
  appId: "1:379383711514:web:cf24555b32fae92a760ea3"
};

//Starts Firebase and refrences the service
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Chat(props) {
    let { name, color } = props.route.params;        
    const [messages, setMessages] = useState([]); // Holds messages
    const [uid, setUid] = useState();             // Unique id for auth
    const [user, setUser] = useState({            // Object for gifthed chat
      _id: '',
    name: '',
    avatar: '',
  });

    //refrence for messages collection from useState
    const messagesRef = collection(db, 'messages');

    useEffect(() => {
        props.navigation.setOptions({ title: name });

        const auth = getAuth();

        // Authenticate users anonymously using Firebase
        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            await signInAnonymously(auth);
          }

          setUid(user.uid);
          setMessages([]);
          setUser({
            _id: user.uid,
            name: name,
            avatar: 'https://placeimg.com/140/140/any',
          });

          // Once the user has been auth new messages are sent and recived
          const messagesQuery = query(messagesRef, orderBy("createdAt", "desc"));
          unsubscribe = onSnapshot(messagesQuery, onCollectionUpdate);

        });

        return () => {
          authUnsubscribe();
      }
    }, [uid])

    // Saves a message object to the collection
    const addMessage = (message) => {
      addDoc(messagesRef, {
        uid: uid,
        _id: message._id, 
        createdAt: message.createdAt,
        text: message.text || '',
        user: user
      });
    }
      
      // When sent displays message and sends to colletion
      const onSend = useCallback((messages = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        addMessage(messages[0]);
      }, [])
      
      // Updates the collection whenever it changes
      const onCollectionUpdate = (querySnapshot) => {
        const messages = []
        querySnapshot.forEach((doc) => {
          var data = doc.data();
          messages.push({
            _id: data._id,
            text: data.text,
            createdAt: data.createdAt.toDate(),
            user: data.user
          });
        });
        setMessages(messages);
      }

      // Styles the message bubble
      const renderBubble = (props) => {
        return (
          <Bubble
            {...props}
            wrapperStyle={{
              right: {
                backgroundColor: '#000'
              }
            }}
          />
        )
      }

    return (
        <View style={[{ backgroundColor: color }, styles.container]}>
      <GiftedChat
        renderBubble={renderBubble.bind()}
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        }}
      />
      {/* Fixes rendering issues for certain android phones */}
      {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

    text: {
        color: '#ffffff'
    },
});