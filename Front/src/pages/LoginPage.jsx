import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showPasswordDrawer = studentId.length >= 4;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      alert("학번 또는 교번을 입력해주세요.");
      return;
    }
    if (!showPasswordDrawer) {
      return;
    }
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      alert("인증에 성공했습니다! 백석 AI 비서 맞춤 대시보드로 이동합니다.");
      setIsSubmitting(false);
    }, 1000);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    alert("백석대학교 통합 계정 확인 요청이 전송되었습니다. 웹메일 인증 링크를 확인해주세요!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-slate-50 text-slate-900 min-h-[100dvh] flex flex-col justify-between relative overflow-x-hidden selection:bg-baekseok-600 selection:text-white"
    >
      {/* BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
        <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-blue-300/25 blur-3xl"></div>
        <div className="absolute top-1/2 -left-28 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl"></div>
        <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-baekseok-500/10 blur-3xl"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden pointer-events-none z-0">
          <div className="select-none pointer-events-none flex items-center justify-center" style={{ transform: 'rotate(-45deg)' }}>
            <span className="watermark-motto font-black tracking-tight whitespace-nowrap select-none" style={{ fontSize: 'clamp(42px, 5vw, 76px)', color: 'rgba(30, 64, 175, 0.24)', lineHeight: 1, filter: 'none', textShadow: 'none', WebkitFontSmoothing: 'antialiased' }}>
              진리가 너희를 자유케 하리라
            </span>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION / BRAND HEADER */}
      <header className="w-full max-w-[440px] mx-auto px-5 pt-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img alt="백석대학교 공식 로고" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDz8vSqec5sAKlKQvOBxW_7Ly5sNauZUoOeQzqLNCFiBHTSF7pvtltwqmb5MpP3biiAz1lem0QZMYAEgaNqf1svg0BtCv0KE7KZGZ9lNEw6Wd_X4pXRpQHy2hjLtH0pO45j7ZbpUNjlOnyz8jXnRxfwkLKKf8xa-NJsmWfCNXM3iLpQwqLNhESJ7K0HOy6GfJRCgBn5l2IHnfA6OHYKss4WmCcjMaXgWb4AsO7_VCU_Kz3QQyepbc2Qoda1yRaFEet4w" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[17px] text-slate-900 tracking-tight">백석 AI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-baekseok-700 tracking-wide">CAMPUS</span>
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-slate-200/70 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </header>

      {/* MAIN AUTH CONTAINER */}
      <main className="w-full max-w-[440px] mx-auto px-5 py-6 z-10 flex flex-col justify-center flex-1">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">스마트한 백석 라이프의 시작</h1>
          <p className="text-xs text-slate-500 mt-1.5 break-keep-all leading-relaxed">
            학사일정, 강의실 안내, 공강 맞춤 추천까지<br/>
            나만의 맞춤형 <span className="text-baekseok-700 font-bold">백석 AI 비서</span>를 만나보세요
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center mb-5 backdrop-blur-sm">
          <button onClick={() => setActiveTab('login')} className={`flex-1 py-2 text-xs rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${activeTab === 'login' ? 'font-bold shadow-sm bg-white text-baekseok-700' : 'font-medium text-slate-500 hover:text-slate-800'}`} type="button">
            <iconify-icon className="text-sm" icon="solar:user-bold"></iconify-icon>
            <span>학번/교번 로그인</span>
          </button>
          <button onClick={() => setActiveTab('signup')} className={`flex-1 py-2 text-xs rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${activeTab === 'signup' ? 'font-bold shadow-sm bg-white text-baekseok-700' : 'font-medium text-slate-500 hover:text-slate-800'}`} type="button">
            <iconify-icon className="text-sm" icon="solar:user-plus-rounded-bold"></iconify-icon>
            <span>새 계정 등록</span>
          </button>
        </div>

        {/* Auth Card Frame */}
        <div className="border border-slate-200/80 rounded-3xl p-6 shadow-float relative overflow-hidden backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', boxShadow: 'rgba(0, 35, 111, 0.08) 0px 20px 40px -15px, rgba(255, 255, 255, 0.8) 0px 0px 0px 1px inset' }}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-baekseok-700 via-blue-500 to-indigo-600"></div>

          {activeTab === 'login' ? (
            <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="input-login-id">
                    <span>학번 또는 교번</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">포털 종합정보시스템 계정</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
                    <iconify-icon className="text-lg" icon="solar:card-2-bold"></iconify-icon>
                  </div>
                  <input value={studentId} onChange={(e) => setStudentId(e.target.value)} autoComplete="username" className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600 transition-all" id="input-login-id" name="studentId" placeholder="학번 8자리 (예: 20221340)" type="text" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(4px)' }} />
                  <button onClick={() => setStudentId('20221340')} className="absolute right-2 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-baekseok-700 hover:bg-blue-100 hover:text-blue-700 active:scale-95 rounded-lg transition-all border border-blue-200/60 shadow-xs" type="button">예시 학번</button>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 pl-1">
                  {showPasswordDrawer ? (
                    <>
                      <iconify-icon icon="solar:check-circle-bold" className="text-emerald-500 text-xs"></iconify-icon>
                      <span className="text-emerald-600 font-semibold">학번 입력 완료. 비밀번호를 입력해주세요.</span>
                    </>
                  ) : (
                    <>
                      <iconify-icon icon="solar:info-circle-linear" className="text-baekseok-600 text-xs"></iconify-icon>
                      <span>학번을 입력하시면 비밀번호 입력창이 자동으로 열립니다.</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`transition-all duration-300 transform overflow-hidden flex flex-col gap-1.5 ${showPasswordDrawer ? 'max-h-48 opacity-100 translate-y-0 pointer-events-auto' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="input-login-pw">
                    <span>비밀번호</span>
                    <span className="text-rose-500 font-bold">*</span>
                    <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/50">학번 확인됨</span>
                  </label>
                  <a className="text-[11px] font-medium text-baekseok-600 hover:underline transition-colors" href="#">비밀번호 찾기</a>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
                    <iconify-icon className="text-lg" icon="solar:lock-keyhole-bold"></iconify-icon>
                  </div>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600 transition-all" id="input-login-pw" name="password" placeholder="통합 포털 비밀번호 입력" type={isPasswordVisible ? 'text' : 'password'} style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(4px)' }} />
                  <button onClick={() => setIsPasswordVisible(!isPasswordVisible)} aria-label="비밀번호 보기 토글" className="absolute right-3 text-slate-400 hover:text-slate-700 active:scale-90 transition-transform flex items-center justify-center p-1" type="button">
                    <iconify-icon className="text-lg" icon={isPasswordVisible ? 'solar:eye-bold' : 'solar:eye-closed-bold'}></iconify-icon>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input defaultChecked className="w-4 h-4 text-baekseok-600 rounded border-slate-300 focus:ring-baekseok-500" type="checkbox" />
                    <span className="font-medium text-slate-700">로그인 상태 유지</span>
                  </label>
                  <span className="text-[11px] text-slate-400">보안 접속 중</span>
                </div>
              </div>

              <div className="pt-2">
                <button disabled={isSubmitting} className="relative overflow-hidden w-full py-3.5 px-4 rounded-2xl bg-baekseok-600 hover:bg-baekseok-700 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(37,99,235,0.35)] hover:shadow-[0_10px_25px_-5px_rgba(26,86,219,0.5)] transition-all duration-300 group disabled:opacity-80" type="submit">
                  <span className="pointer-events-none absolute inset-0 -top-1 -bottom-1 w-20 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"></span>
                  {isSubmitting ? (
                    <>
                      <iconify-icon icon="solar:spinner-linear" className="relative z-10 text-lg animate-spin"></iconify-icon>
                      <span className="relative z-10">백석 AI 맞춤형 세션 연결 중...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">{showPasswordDrawer ? "백석 AI 비서 로그인" : "학번을 입력해주세요"}</span>
                      <iconify-icon className="relative z-10 text-base group-hover:translate-x-1.5 transition-transform duration-200" icon={showPasswordDrawer ? 'solar:login-2-bold' : 'solar:arrow-right-linear'}></iconify-icon>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="flex flex-col gap-3.5" onSubmit={handleSignupSubmit}>
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-baekseok-900 mb-1">
                <iconify-icon className="text-baekseok-600 text-base shrink-0 mt-0.5" icon="solar:shield-check-bold"></iconify-icon>
                <p className="leading-relaxed">
                  백석대학교 재학생 및 교직원은 <strong>학번/교번 인증</strong>을 통해 AI 비서 계정을 즉시 생성할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">이름</label>
                <input className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600" placeholder="성명 입력 (예: 김백석)" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">학부 / 학과</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600" placeholder="예: 컴퓨터공학부" type="text" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">학번</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600" placeholder="8자리 학번" type="text" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">학교 웹메일 (@bu.ac.kr)</label>
                <div className="flex items-center gap-1.5">
                  <input className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600" placeholder="아이디" type="text" />
                  <span className="text-xs font-bold text-slate-500">@bu.ac.kr</span>
                  <button className="px-3 py-2.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 active:scale-95 text-slate-800 text-xs font-bold rounded-xl shrink-0 transition-all" type="button">인증요청</button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">AI 비서 비밀번호 설정</label>
                <input className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-baekseok-600/30 focus:border-baekseok-600" placeholder="영문, 숫자 포함 8자리 이상" type="password" />
              </div>
              <div className="pt-2">
                <button className="relative overflow-hidden w-full py-3.5 px-4 rounded-2xl bg-baekseok-600 hover:bg-baekseok-700 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-sm shadow-[0_10px_30px_-5px_rgba(37,99,235,0.35)] hover:shadow-[0_10px_25px_-5px_rgba(26,86,219,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group" type="submit">
                  <span className="pointer-events-none absolute inset-0 -top-1 -bottom-1 w-20 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"></span>
                  <span className="relative z-10">회원가입 완료 및 AI 비서 시작</span>
                  <iconify-icon className="relative z-10 text-base group-hover:translate-x-1.5 transition-transform duration-200" icon="solar:check-circle-bold"></iconify-icon>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER / MOTTO BANNER */}
      <footer className="w-full max-w-[440px] mx-auto px-5 pb-5 pt-4 z-10 flex flex-col items-center text-center gap-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-serif">
          <span className="font-bold text-baekseok-800 watermark-motto">백석대학교</span>
          <span>•</span>
          <span className="watermark-motto text-slate-600 font-medium">진리가 너희를 자유케 하리라</span>
        </div>
      </footer>
    </motion.div>
  );
}
