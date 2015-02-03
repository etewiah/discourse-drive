module Drive

  require_dependency "auth/current_user_provider"

  class SubDomainCurrentUserProvider  < Auth::DefaultCurrentUserProvider
    ::AUTH_DOMAIN = Rails.env.development? ? ".lvh.me" : ".klavado.com"


    def log_off_user(session, cookies)
      # auth_domain = @env["HTTP_ORIGIN"].split(':')[1].gsub('//','.')
      cookies[TOKEN_COOKIE] = { value: nil, domain: ::AUTH_DOMAIN }
    end

    def log_on_user(user, session, cookies)
      Rails.logger.debug "HTTP_ORIGIN while logging on is #{@env["HTTP_ORIGIN"]}"
      # auth_domain = @env["HTTP_ORIGIN"].split(':')[1].gsub('//','.')
      # Discourse.base_url.split(':')[1].gsub('//','.')
      unless user.auth_token && user.auth_token.length == 32
        user.auth_token = SecureRandom.hex(16)
        user.save!
      end
      cookies.permanent[TOKEN_COOKIE] = { value: user.auth_token, httponly: true, domain: ::AUTH_DOMAIN }
      make_developer_admin(user)
      @env[CURRENT_USER_KEY] = user
    end

  end
end

Discourse.current_user_provider = Drive::SubDomainCurrentUserProvider
