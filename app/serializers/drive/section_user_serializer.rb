module Drive
  class SectionUserSerializer < ApplicationSerializer
    attributes :id, :username, :uploaded_avatar_id, :avatar_template,
    :user_id, :role

    def user_id
      object.user.id
    end

    def username
      object.user.username
    end

    def uploaded_avatar_id
      object.user.uploaded_avatar_id
    end
    def avatar_template
      object.user.avatar_template
    end

    def role
      object.role
    end



  end

end
