import { useState,useEffect, useRef } from 'react'

import './App.css'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util';


function App() {
  const [isFFmpegLoaded,setIsFFmpegLoaded] = useState(false);
  const [inputVideo,setInputVideo] = useState();
  const [outVideo, setOutVideo] = useState();
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef(null);


  const load = async () =>{
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
        messageRef.current.innerHTML = message;
        console.log(message);
    });   
    await ffmpeg.load();
    setIsFFmpegLoaded(true);
  }

  useEffect(()=>{
    load();

  },[]

  )

  const validateAndTrim = () =>{
    let isValid = true;
    let LogString = "";
    const start_time = document.getElementById("video_start").value;
    const end_time = document.getElementById("video_end").value;
    const input_video_duration = document.getElementById("input_video").duration;
    let valid_start;
    let valid_end;
    if (!isNaN(start_time) && start_time>=0 && (isNaN(input_video_duration) || start_time<input_video_duration)){
      valid_start = start_time;
    }
    else{
      valid_start = 0;
      LogString+="invalid Start time, trimming will be attempted with default value of 0 "
      isValid = false;
    }
    if (!isNaN(end_time) && end_time>0 && (isNaN(input_video_duration) || end_time<=input_video_duration)){
      valid_end = end_time;

    }
    else{
      if (isNaN(input_video_duration)){
        alert("End time must be provided.")
        return
      }
      valid_end = input_video_duration;      
      LogString+=`Invalid End time, trimming will be attempted with default value of ${input_video_duration} `;
      isValid = false;
    }
    if (valid_start>valid_end){
      [valid_start, valid_end] = [valid_end, valid_start];
      LogString+="Start time must be less than End time, trimming will be attempted with times swapped ";
      console.log(`start_time=${start_time}\n end_time=${end_time} \n valid_start=${valid_start}\n valid_end=${valid_end}\n input_video_duration=${input_video_duration}`)
      isValid = false;
    }
    if (! isValid){
      window.alert(LogString);
      console.warn(LogString);
    }
    
    trimMediaStream(valid_start, valid_end);
  }
  const trimMediaStream = async (start_time, end_time) =>{
    const ffmpeg = ffmpegRef.current
    ffmpeg.writeFile(inputVideo.name, await fetchFile(inputVideo))
    const media_extension = inputVideo.name.split(".").slice(-1)[0];

    await ffmpeg.exec(["-ss", start_time, "-to", end_time,'-i',inputVideo.name,"-c", "copy", `out.${media_extension}`])

    const data = await ffmpeg.readFile(`out.${media_extension}`)
    const outVideoUrl  = URL.createObjectURL(new Blob([data.buffer],{type:'video/*'}));
    setOutVideo(outVideoUrl)
  }

  return <div className='relative overflow-hidden bg-gray-800 flex flex-col items-center'>
    <h1 className='text-5xl p-5'>Video Trimmer</h1>
    {isFFmpegLoaded ? (
      <div className='p-5'>
        {inputVideo && <video
        id="input_video"
        controls
        className='p-5'
        src={URL.createObjectURL(inputVideo)}
        ></video>}
        <label htmlFor="videoPicker" className='bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded m-5'>Select video:</label>
        <input className='p-5 w-full' type='file' id='videoPicker' accept='video/*' onChange={(e)=> setInputVideo(e.target.files?.item(0))}/>


        {inputVideo && 
        <>
          <span>Enter times in Seconds</span>
          <div className='flex flex-row ps-5 mb-3 items-center'>
            <label className='pe-3' htmlFor="video_start">Start:</label>
            <input type="number" id="video_start" defaultValue="0" className='shadow appearance-none border rounded w-3xs py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline'/>
          </div>
          <div  className='flex flex-row ps-5 items-center'>
            <label className='pe-3' htmlFor="video_end">End:&nbsp;</label>
            <input type="number" id="video_end" className='shadow appearance-none border rounded w-3xs py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline'/>
          </div>
          <button className='bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded m-5' onClick={validateAndTrim}>Convert</button>
          <p ref={messageRef}></p>
        </>
        }

        {outVideo &&
        <>
          <video 
          className='p-5'
          controls src={outVideo}/>
          <a href={outVideo} download={"trimmed_" + inputVideo.name} className='bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded m-5' >Download video</a>
        </> 
        }


      </div>
    ) :
    (
    <div>
      <div className="flex items-center justify-center w-full h-[80vh] text-gray-100">
        <div>
          <h1 className="text-xl md:text-7xl font-bold flex items-center">L<svg stroke="currentColor" fill="currentColor" strokeWidth="0"
              viewBox="0 0 24 24" className="animate-spin" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM13.6695 15.9999H10.3295L8.95053 17.8969L9.5044 19.6031C10.2897 19.8607 11.1286 20 12 20C12.8714 20 13.7103 19.8607 14.4956 19.6031L15.0485 17.8969L13.6695 15.9999ZM5.29354 10.8719L4.00222 11.8095L4 12C4 13.7297 4.54894 15.3312 5.4821 16.6397L7.39254 16.6399L8.71453 14.8199L7.68654 11.6499L5.29354 10.8719ZM18.7055 10.8719L16.3125 11.6499L15.2845 14.8199L16.6065 16.6399L18.5179 16.6397C19.4511 15.3312 20 13.7297 20 12L19.997 11.81L18.7055 10.8719ZM12 9.536L9.656 11.238L10.552 14H13.447L14.343 11.238L12 9.536ZM14.2914 4.33299L12.9995 5.27293V7.78993L15.6935 9.74693L17.9325 9.01993L18.4867 7.3168C17.467 5.90685 15.9988 4.84254 14.2914 4.33299ZM9.70757 4.33329C8.00021 4.84307 6.53216 5.90762 5.51261 7.31778L6.06653 9.01993L8.30554 9.74693L10.9995 7.78993V5.27293L9.70757 4.33329Z">
              </path>
            </svg> ading FFmpeg.wasm. . .</h1>
        </div>
      </div>
    </div>

    )
    }
</div>
}

export default App
